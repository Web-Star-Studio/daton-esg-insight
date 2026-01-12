import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useNavigate } from "react-router-dom"
import { User, Building2, Users, CreditCard, Settings, MoreHorizontal, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { getUserAndCompany, type UserWithCompany } from "@/utils/auth"
import { sanitizeFormData } from "@/utils/inputSanitizer"
import { useAuth } from "@/contexts/AuthContext"
import { AIProcessingSettings } from "@/components/settings/AIProcessingSettings"
import { useUserManagement, type UserProfile } from "@/hooks/data/useUserManagement"
import { UserListTable } from "@/components/users/UserListTable"
import { UserFormModal } from "@/components/users/UserFormModal"

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
  const [userData, setUserData] = useState<UserWithCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { restartOnboarding } = useAuth();

  const {
    users,
    usersLoading,
    createUser,
    updateUser,
    isCreating,
    isUpdating,
  } = useUserManagement();

  const handleNewUser = () => {
    setSelectedUser(null);
    setUserModalOpen(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setUserModalOpen(true);
  };

  const handleSaveUser = (data: Partial<UserProfile>) => {
    if (selectedUser) {
      updateUser({ id: selectedUser.id, ...data });
    } else {
      createUser(data);
    }
    setUserModalOpen(false);
    setSelectedUser(null);
  };

  const perfilForm = useForm<z.infer<typeof perfilSchema>>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nome: "",
      email: "",
      cargo: "",
      senhaAtual: "",
      novaSenha: "",
      confirmarSenha: "",
    },
  });

  const empresaForm = useForm<z.infer<typeof empresaSchema>>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      nomeEmpresa: "",
      cnpj: "",
      setor: "",
      rua: "",
      numero: "",
      cidade: "",
      estado: "",
      cep: "",
    },
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await getUserAndCompany();
      if (data) {
        setUserData(data);
        
        perfilForm.reset({
          nome: data.full_name,
          email: data.email,
          cargo: data.role,
          senhaAtual: "",
          novaSenha: "",
          confirmarSenha: "",
        });

        if (data.company) {
          const addressParts = data.company.headquarters_address?.split(', ') || [];
          empresaForm.reset({
            nomeEmpresa: data.company.name,
            cnpj: data.company.cnpj,
            setor: data.company.sector || "",
            rua: addressParts[0] || "",
            numero: addressParts[1] || "",
            cidade: addressParts[2] || "",
            estado: addressParts[3] || "",
            cep: addressParts[4] || "",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do usuário.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPerfil = async (values: z.infer<typeof perfilSchema>) => {
    if (!userData) return;

    try {
      setLoading(true);
      const sanitizedData = sanitizeFormData(values, {
        nome: { maxLength: 100, trimWhitespace: true },
        cargo: { maxLength: 100, trimWhitespace: true },
      });

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: sanitizedData.nome,
          role: sanitizedData.cargo as any,
        })
        .eq('id', userData.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });

      await loadUserData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitEmpresa = async (values: z.infer<typeof empresaSchema>) => {
    if (!userData) return;

    try {
      setLoading(true);
      const sanitizedData = sanitizeFormData(values, {
        nomeEmpresa: { maxLength: 200, trimWhitespace: true },
        cnpj: { maxLength: 20, trimWhitespace: true },
        rua: { maxLength: 300, trimWhitespace: true },
        cidade: { maxLength: 100, trimWhitespace: true },
        estado: { maxLength: 50, trimWhitespace: true },
        cep: { maxLength: 10, trimWhitespace: true },
      });

      const address = `${sanitizedData.rua}, ${sanitizedData.numero}, ${sanitizedData.cidade}, ${sanitizedData.estado}, ${sanitizedData.cep}`;

      const { error } = await supabase
        .from('companies')
        .update({
          name: sanitizedData.nomeEmpresa,
          cnpj: sanitizedData.cnpj,
          sector: sanitizedData.setor,
          headquarters_address: address,
        })
        .eq('id', userData.company_id);

      if (error) throw error;

      toast({
        title: "Dados da empresa atualizados",
        description: "As informações da empresa foram salvas com sucesso.",
      });

      await loadUserData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dados da empresa.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
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

                    <Button type="submit" disabled={loading}>
                      {loading ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {activeSection === "perfil" && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Guia de Configuração Inicial
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Quer explorar novamente as funcionalidades principais da plataforma? 
                  Reinicie o guia de configuração para ver o tour interativo.
                </p>
                
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">O guia irá reiniciar:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                    <li>Tour interativo pelas principais páginas</li>
                    <li>Dicas de primeiro uso</li>
                    <li>Configurações básicas recomendadas</li>
                  </ul>
                </div>

                <Button 
                  onClick={() => {
                    if (window.confirm("Tem certeza que deseja reiniciar o guia de configuração? Você será redirecionado para o início do processo.")) {
                      restartOnboarding();
                      toast({
                        title: "Guia reiniciado",
                        description: "Você será redirecionado para o guia de configuração.",
                      });
                    }
                  }}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Reiniciar Guia de Configuração
                </Button>
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
                          <Select onValueChange={field.onChange} value={field.value}>
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

                    <Button type="submit" disabled={loading}>
                      {loading ? "Salvando..." : "Salvar Informações da Empresa"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {activeSection === "usuarios" && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Usuários e Permissões</CardTitle>
                    <CardDescription>
                      Gerencie os usuários da sua empresa e suas permissões de acesso
                    </CardDescription>
                  </div>
                  <Button onClick={handleNewUser}>
                    <Plus className="mr-2 h-4 w-4" />
                    Convidar Usuário
                  </Button>
                </CardHeader>
                <CardContent>
                  <UserListTable 
                    users={users} 
                    onEdit={handleEditUser}
                    isLoading={usersLoading}
                  />
                </CardContent>
              </Card>

              <UserFormModal
                open={userModalOpen}
                onOpenChange={setUserModalOpen}
                user={selectedUser}
                onSave={handleSaveUser}
                isLoading={isCreating || isUpdating}
              />
            </div>
          )}

          {activeSection === "plano" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Plano Atual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-6">
                    <p>Informações de plano e faturamento não configuradas.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "integracoes" && (
            <div className="space-y-6">
              <AIProcessingSettings />
              
              <Card>
                <CardHeader>
                  <CardTitle>Outras Integrações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-6">
                    <p>Outras integrações não configuradas ainda.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}