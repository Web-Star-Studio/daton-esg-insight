import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useNavigate } from "react-router-dom"
import { User, Building2, Users, CreditCard, Settings, MoreHorizontal, Plus } from "lucide-react"
import { MainLayout } from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

const perfilSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  cargo: z.string().min(1, "Cargo é obrigatório"),
  senhaAtual: z.string().optional(),
  novaSenha: z.string().optional(),
  confirmarSenha: z.string().optional(),
}).refine((data) => {
  if (data.novaSenha || data.confirmarSenha) {
    return data.novaSenha === data.confirmarSenha;
  }
  return true;
}, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

const empresaSchema = z.object({
  nomeEmpresa: z.string().min(1, "Nome da empresa é obrigatório"),
  cnpj: z.string().min(1, "CNPJ é obrigatório"),
  setor: z.string().min(1, "Setor é obrigatório"),
  rua: z.string().min(1, "Rua é obrigatória"),
  numero: z.string().min(1, "Número é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  estado: z.string().min(1, "Estado é obrigatório"),
  cep: z.string().min(1, "CEP é obrigatório"),
});

type Section = "perfil" | "empresa" | "usuarios" | "plano" | "integracoes";

const menuItems = [
  { id: "perfil" as Section, label: "Meu Perfil", icon: User },
  { id: "empresa" as Section, label: "Empresa", icon: Building2 },
  { id: "usuarios" as Section, label: "Usuários e Permissões", icon: Users },
  { id: "plano" as Section, label: "Plano e Faturamento", icon: CreditCard },
  { id: "integracoes" as Section, label: "Integrações", icon: Settings },
];

const mockUsuarios = [
  { id: 1, nome: "Ana Silva Santos", email: "ana.silva@empresa.com", cargo: "Gerente de Sustentabilidade", nivel: "Admin" },
  { id: 2, nome: "Carlos Oliveira", email: "carlos.oliveira@empresa.com", cargo: "Analista Ambiental", nivel: "Editor" },
  { id: 3, nome: "Mariana Costa", email: "mariana.costa@empresa.com", cargo: "Assistente", nivel: "Leitor" },
];

const setorOptions = [
  "Manufatura",
  "Agronegócio", 
  "Tecnologia",
  "Varejo",
  "Serviços",
  "Construção",
  "Químico",
  "Alimentício",
];

export default function Configuracao() {
  const [activeSection, setActiveSection] = useState<Section>("perfil");
  const { toast } = useToast();
  const navigate = useNavigate();

  const perfilForm = useForm<z.infer<typeof perfilSchema>>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nome: "Ana Silva Santos",
      email: "ana.silva@empresa.com",
      cargo: "Gerente de Sustentabilidade",
      senhaAtual: "",
      novaSenha: "",
      confirmarSenha: "",
    },
  });

  const empresaForm = useForm<z.infer<typeof empresaSchema>>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      nomeEmpresa: "Indústrias Reunidas S.A.",
      cnpj: "00.123.456/0001-78",
      setor: "Manufatura",
      rua: "Rua das Indústrias, 1500",
      numero: "1500",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01234-000",
    },
  });

  const onSubmitPerfil = (values: z.infer<typeof perfilSchema>) => {
    console.log("Perfil:", values);
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram salvas com sucesso.",
    });
  };

  const onSubmitEmpresa = (values: z.infer<typeof empresaSchema>) => {
    console.log("Empresa:", values);
    toast({
      title: "Dados da empresa atualizados",
      description: "As informações da empresa foram salvas com sucesso.",
    });
  };

  const getBadgeVariant = (nivel: string) => {
    switch (nivel) {
      case "Admin": return "default";
      case "Editor": return "secondary";
      case "Leitor": return "outline";
      default: return "outline";
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        </div>

        <div className="flex gap-6">
          {/* Navigation Sidebar */}
          <div className="w-60 space-y-1">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveSection(item.id)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {activeSection === "perfil" && (
              <Card>
                <CardHeader>
                  <CardTitle>Meu Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Form {...perfilForm}>
                    <form onSubmit={perfilForm.handleSubmit(onSubmitPerfil)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={perfilForm.control}
                          name="nome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={perfilForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail</FormLabel>
                              <FormControl>
                                <Input {...field} disabled />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={perfilForm.control}
                        name="cargo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cargo</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Alterar Senha</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={perfilForm.control}
                            name="senhaAtual"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Senha Atual</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={perfilForm.control}
                            name="novaSenha"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nova Senha</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={perfilForm.control}
                            name="confirmarSenha"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirmar Nova Senha</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Button type="submit">Salvar Alterações</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeSection === "empresa" && (
              <Card>
                <CardHeader>
                  <CardTitle>Dados da Empresa</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...empresaForm}>
                    <form onSubmit={empresaForm.handleSubmit(onSubmitEmpresa)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={empresaForm.control}
                          name="nomeEmpresa"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome da Empresa</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={empresaForm.control}
                          name="cnpj"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CNPJ</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={empresaForm.control}
                        name="setor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Setor de Atividade</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o setor" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {setorOptions.map((setor) => (
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

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Endereço</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <FormField
                              control={empresaForm.control}
                              name="rua"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Rua</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={empresaForm.control}
                            name="numero"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Número</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={empresaForm.control}
                            name="cidade"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cidade</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={empresaForm.control}
                            name="estado"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={empresaForm.control}
                            name="cep"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CEP</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Button type="submit">Salvar Informações da Empresa</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeSection === "usuarios" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Usuários e Permissões</CardTitle>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Convidar Usuário
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Nível de Acesso</TableHead>
                        <TableHead className="w-[50px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockUsuarios.map((usuario) => (
                        <TableRow key={usuario.id}>
                          <TableCell className="font-medium">{usuario.nome}</TableCell>
                          <TableCell>{usuario.email}</TableCell>
                          <TableCell>{usuario.cargo}</TableCell>
                          <TableCell>
                            <Badge variant={getBadgeVariant(usuario.nivel)}>
                              {usuario.nivel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Editar Permissão</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  Remover
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {activeSection === "plano" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Plano e Faturamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold">Seu Plano Atual: <span className="text-primary">Plano Pro</span></h3>
                        <p className="text-muted-foreground">Sua próxima fatura será em 01/10/2025.</p>
                      </div>
                      <Button variant="outline">Gerenciar Assinatura</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Faturas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Em breve você poderá visualizar e baixar suas faturas aqui.</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "integracoes" && (
              <Card>
                <CardHeader>
                  <CardTitle>Integrações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Configure integrações com sistemas externos para sincronizar dados automaticamente.
                  </p>
                  <div className="mt-6">
                    <p className="text-sm text-muted-foreground">Em breve: Integrações com ERPs, sistemas de gestão ambiental e APIs de terceiros.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}