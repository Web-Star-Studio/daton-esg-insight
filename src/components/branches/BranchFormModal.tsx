import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateBranch, useUpdateBranch, BranchWithManager } from "@/services/branches";
import { useCompanyUsers } from "@/hooks/data/useCompanyUsers";
import { Loader2, MapPin, Search } from "lucide-react";
import { geocodeAddress } from "@/utils/geocoding";
import { fetchAddressByCep, formatCep, isValidCep } from "@/utils/viaCep";
import { unifiedToast } from "@/utils/unifiedToast";
import { validateCNPJ, formatCNPJ } from "@/utils/formValidation";
import { CheckCircle2, XCircle } from "lucide-react";

const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

const branchFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  code: z.string().optional(),
  cnpj: z.string().optional().refine(
    (val) => !val || val.replace(/\D/g, '').length === 0 || validateCNPJ(val),
    { message: "CNPJ inválido" }
  ),
  cep: z.string().optional(),
  address: z.string().optional(),
  street_number: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default("Brasil"),
  phone: z.string().optional(),
  manager_id: z.string().optional(),
  is_headquarters: z.boolean().default(false),
  status: z.string().default("Ativa"),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

type BranchFormData = z.infer<typeof branchFormSchema>;

interface BranchFormModalProps {
  open: boolean;
  onOpenChange: () => void;
  branch?: BranchWithManager | null;
}

export function BranchFormModal({ open, onOpenChange, branch }: BranchFormModalProps) {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();
  const { data: users, isLoading: isLoadingUsers } = useCompanyUsers();

  const isEditing = !!branch;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<BranchFormData>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      name: "",
      code: "",
      cnpj: "",
      cep: "",
      address: "",
      street_number: "",
      neighborhood: "",
      city: "",
      state: "",
      country: "Brasil",
      phone: "",
      manager_id: "",
      is_headquarters: false,
      status: "Ativa",
      latitude: null,
      longitude: null,
    },
  });

  useEffect(() => {
    if (branch) {
      form.reset({
        name: branch.name,
        code: branch.code || "",
        cnpj: branch.cnpj || "",
        cep: branch.cep || "",
        address: branch.address || "",
        street_number: branch.street_number || "",
        neighborhood: branch.neighborhood || "",
        city: branch.city || "",
        state: branch.state || "",
        country: branch.country || "Brasil",
        phone: branch.phone || "",
        manager_id: branch.manager_id || "",
        is_headquarters: branch.is_headquarters,
        status: branch.status,
        latitude: branch.latitude ?? null,
        longitude: branch.longitude ?? null,
      });
    } else {
      form.reset({
        name: "",
        code: "",
        cnpj: "",
        cep: "",
        address: "",
        street_number: "",
        neighborhood: "",
        city: "",
        state: "",
        country: "Brasil",
        phone: "",
        manager_id: "",
        is_headquarters: false,
        status: "Ativa",
        latitude: null,
        longitude: null,
      });
    }
  }, [branch, form]);

  const handleCnpjChange = (value: string) => {
    const formatted = formatCNPJ(value);
    form.setValue("cnpj", formatted, { shouldValidate: true });
  };

  const cnpjValue = form.watch("cnpj");
  const isCnpjValid = cnpjValue && cnpjValue.replace(/\D/g, '').length === 14 && validateCNPJ(cnpjValue);
  const isCnpjPartial = cnpjValue && cnpjValue.replace(/\D/g, '').length > 0 && cnpjValue.replace(/\D/g, '').length < 14;

  const handleCepChange = async (cep: string) => {
    const formattedCep = formatCep(cep);
    form.setValue("cep", formattedCep);

    // Only search when CEP is complete (8 digits)
    if (!isValidCep(cep)) {
      return;
    }

    setIsLoadingCep(true);
    try {
      const addressData = await fetchAddressByCep(cep);
      
      if (addressData) {
        form.setValue("address", addressData.street);
        form.setValue("neighborhood", addressData.neighborhood);
        form.setValue("city", addressData.city);
        form.setValue("state", addressData.state);
        form.setValue("cep", addressData.cep);
        
        unifiedToast.success("Endereço encontrado!", {
          description: `${addressData.street}, ${addressData.neighborhood} - ${addressData.city}/${addressData.state}`
        });

        // Automatically fetch coordinates after address is found
        await handleGeocodeAfterCep(addressData.city, addressData.state, addressData.street);
      } else {
        unifiedToast.error("CEP não encontrado", {
          description: "Verifique o CEP e tente novamente"
        });
      }
    } catch (error) {
      unifiedToast.error("Erro ao buscar CEP");
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleGeocodeAfterCep = async (city: string, state: string, street?: string) => {
    try {
      const result = await geocodeAddress(city, state, "Brasil", street);
      if (result) {
        form.setValue("latitude", result.latitude);
        form.setValue("longitude", result.longitude);
      }
    } catch (error) {
      // Silent fail for automatic geocoding
      console.error("Auto-geocoding failed:", error);
    }
  };

  const handleGeocode = async () => {
    const city = form.getValues("city");
    const state = form.getValues("state");
    const country = form.getValues("country");
    const address = form.getValues("address");

    if (!city && !state) {
      unifiedToast.error("Informe cidade ou estado para buscar coordenadas");
      return;
    }

    setIsGeocoding(true);
    try {
      const result = await geocodeAddress(city, state, country, address);
      if (result) {
        form.setValue("latitude", result.latitude);
        form.setValue("longitude", result.longitude);
        unifiedToast.success("Coordenadas encontradas!");
      } else {
        unifiedToast.error("Não foi possível encontrar as coordenadas");
      }
    } catch (error) {
      unifiedToast.error("Erro ao buscar coordenadas");
    } finally {
      setIsGeocoding(false);
    }
  };

  const onSubmit = (data: BranchFormData) => {
    const payload = {
      name: data.name,
      code: data.code || undefined,
      cnpj: data.cnpj || undefined,
      cep: data.cep || undefined,
      address: data.address || undefined,
      street_number: data.street_number || undefined,
      neighborhood: data.neighborhood || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      country: data.country || "Brasil",
      phone: data.phone || undefined,
      manager_id: data.manager_id || undefined,
      is_headquarters: data.is_headquarters,
      status: data.status,
      latitude: data.latitude ?? undefined,
      longitude: data.longitude ?? undefined,
    };

    if (isEditing && branch) {
      updateMutation.mutate(
        { id: branch.id, updates: payload },
        { onSuccess: () => onOpenChange() }
      );
    } else {
      createMutation.mutate(payload, { onSuccess: () => onOpenChange() });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Filial" : "Nova Filial"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações da filial"
              : "Preencha os dados para cadastrar uma nova filial"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da filial" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Código */}
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="Código identificador" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CNPJ */}
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="00.000.000/0000-00"
                          maxLength={18}
                          {...field}
                          onChange={(e) => handleCnpjChange(e.target.value)}
                          className="pr-10"
                        />
                      </FormControl>
                      {isCnpjValid && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </div>
                      )}
                      {cnpjValue && cnpjValue.replace(/\D/g, '').length === 14 && !isCnpjValid && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <XCircle className="h-4 w-4 text-destructive" />
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Telefone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* CEP */}
            <FormField
              control={form.control}
              name="cep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        placeholder="00000-000"
                        maxLength={9}
                        {...field}
                        onChange={(e) => handleCepChange(e.target.value)}
                        className="pr-10"
                      />
                    </FormControl>
                    {isLoadingCep && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {!isLoadingCep && field.value && isValidCep(field.value) && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Search className="h-4 w-4 text-green-500" />
                      </div>
                    )}
                  </div>
                  <FormDescription className="text-xs">
                    Digite o CEP para preencher o endereço automaticamente
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Endereço (Logradouro) */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, Avenida, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Número */}
              <FormField
                control={form.control}
                name="street_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input placeholder="Nº" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bairro */}
              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Bairro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cidade */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estado */}
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BRAZILIAN_STATES.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* País */}
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>País</FormLabel>
                  <FormControl>
                    <Input placeholder="País" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gerente Responsável */}
              <FormField
                control={form.control}
                name="manager_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gerente Responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingUsers ? "Carregando..." : "Selecione"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users?.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Ativa">Ativa</SelectItem>
                        <SelectItem value="Inativa">Inativa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* É Matriz */}
            <FormField
              control={form.control}
              name="is_headquarters"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>É Matriz?</FormLabel>
                    <FormDescription className="text-xs">
                      Marque se esta é a sede principal
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Coordenadas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-medium">Coordenadas (para mapa)</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGeocode}
                  disabled={isGeocoding}
                  className="gap-2"
                >
                  {isGeocoding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  Buscar Coordenadas
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Latitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="-23.5505"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === "" ? null : parseFloat(val));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Longitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="-46.6333"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === "" ? null : parseFloat(val));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onOpenChange}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
