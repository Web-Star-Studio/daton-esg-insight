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
import { useCreateBranch, useUpdateBranch, BranchWithManager, getHeadquarters, Branch } from "@/services/branches";
import { useCompanyEmployees } from "@/hooks/data/useCompanyEmployees";
import { Loader2, MapPin, Search, Building2, FileSearch, FileUp } from "lucide-react";
import { geocodeAddress } from "@/utils/geocoding";
import { fetchAddressByCep, formatCep, isValidCep } from "@/utils/viaCep";
import { unifiedToast } from "@/utils/unifiedToast";
import { validateCNPJ, formatCNPJ } from "@/utils/formValidation";
import { CheckCircle2, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseSupabaseFunctionError } from "@/utils/supabaseFunctionError";

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
  parent_branch_id: z.string().optional(),
  status: z.string().default("Ativo"),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

type BranchFormData = z.infer<typeof branchFormSchema>;

export interface BranchImportData {
  cnpj?: string;
  name?: string;
  address?: string;
  street_number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  phone?: string;
}

interface BranchFormModalProps {
  open: boolean;
  onOpenChange: () => void;
  branch?: BranchWithManager | null;
  initialData?: BranchImportData | null;
}

export function BranchFormModal({ open, onOpenChange, branch, initialData }: BranchFormModalProps) {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();
  const { data: employees, isLoading: isLoadingEmployees } = useCompanyEmployees();
  const { data: headquarters, isLoading: isLoadingHeadquarters } = useQuery({
    queryKey: ['branches', 'headquarters'],
    queryFn: getHeadquarters,
  });

  const isEditing = !!branch;
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Handle PDF import
  const handleImportPdf = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - accept PDF and images
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      unifiedToast.error("Arquivo inválido", {
        description: "Aceitos: PDF, PNG, JPG ou WEBP"
      });
      event.target.value = '';
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      unifiedToast.error("Arquivo muito grande", {
        description: "O arquivo deve ter no máximo 10MB"
      });
      event.target.value = '';
      return;
    }

    setIsLoadingPdf(true);
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Determine if it's an image or PDF
      const isImage = file.type.startsWith('image/');

      // Call Edge Function with appropriate data
      const { data, error } = await supabase.functions.invoke('cnpj-pdf-extractor', {
        body: isImage 
          ? { imageBase64: base64, fileName: file.name, fileType: file.type }
          : { pdfBase64: base64, fileName: file.name, fileType: file.type }
      });

      if (error) {
        console.error('CNPJ extractor error:', error);
        const parsed = parseSupabaseFunctionError(error);
        unifiedToast.error(
          parsed.hint === "image_required" ? "PDF escaneado" : "Erro ao processar arquivo",
          {
            description:
              parsed.message ||
              "Não foi possível processar o documento. Tente novamente.",
          },
        );
        return;
      }

      if (!data?.success) {
        unifiedToast.error("Erro na extração", {
          description:
            (data as any)?.error ||
            "Não foi possível extrair dados do documento. Se o PDF for escaneado, envie um print/foto (PNG/JPG/WEBP).",
        });
        return;
      }

      const extractedData = data.data;

      // Fill form with extracted data
      if (extractedData.cnpj) {
        form.setValue("cnpj", extractedData.cnpj);
      }
      if (extractedData.name) {
        form.setValue("name", extractedData.tradeName || extractedData.name);
      }
      if (extractedData.address) {
        form.setValue("address", extractedData.address);
      }
      if (extractedData.streetNumber) {
        form.setValue("street_number", extractedData.streetNumber);
      }
      if (extractedData.neighborhood) {
        form.setValue("neighborhood", extractedData.neighborhood);
      }
      if (extractedData.city) {
        form.setValue("city", extractedData.city);
      }
      if (extractedData.state) {
        form.setValue("state", extractedData.state);
      }
      if (extractedData.cep) {
        form.setValue("cep", formatCep(extractedData.cep));
      }
      if (extractedData.phone) {
        form.setValue("phone", extractedData.phone);
      }

      unifiedToast.success("Dados do PDF importados!", {
        description: `${extractedData.name} - ${extractedData.city}/${extractedData.state}`
      });

      // Automatically fetch coordinates
      if (extractedData.city && extractedData.state) {
        await handleGeocodeAfterCep(extractedData.city, extractedData.state, extractedData.address);
      }

    } catch (error) {
      console.error('PDF import error:', error);
      unifiedToast.error("Erro ao importar PDF", {
        description: "Tente novamente com um arquivo válido"
      });
    } finally {
      setIsLoadingPdf(false);
      event.target.value = '';
    }
  };

  // Function to fetch CNPJ data from API
  const handleFetchCnpj = async () => {
    const cnpjValue = form.getValues("cnpj");
    
    if (!cnpjValue || cnpjValue.replace(/\D/g, '').length !== 14) {
      unifiedToast.error("CNPJ inválido", {
        description: "Digite um CNPJ completo com 14 dígitos"
      });
      return;
    }

    if (!validateCNPJ(cnpjValue)) {
      unifiedToast.error("CNPJ inválido", {
        description: "O CNPJ informado não é válido"
      });
      return;
    }

    setIsLoadingCnpj(true);
    try {
      const { data, error } = await supabase.functions.invoke('cnpj-lookup', {
        body: { cnpj: cnpjValue }
      });

      if (error) {
        console.error('CNPJ lookup error:', error);
        unifiedToast.error("Erro ao buscar CNPJ", {
          description: error.message || "Tente novamente mais tarde"
        });
        return;
      }

      if (!data.success) {
        unifiedToast.error("CNPJ não encontrado", {
          description: data.error || "Verifique o CNPJ e tente novamente"
        });
        return;
      }

      const cnpjData = data.data;
      
      // Fill form with retrieved data
      form.setValue("name", cnpjData.tradeName || cnpjData.name);
      form.setValue("address", cnpjData.address);
      form.setValue("street_number", cnpjData.streetNumber);
      form.setValue("neighborhood", cnpjData.neighborhood);
      form.setValue("city", cnpjData.city);
      form.setValue("state", cnpjData.state);
      form.setValue("cep", formatCep(cnpjData.cep));
      form.setValue("phone", cnpjData.phone);

      unifiedToast.success("Dados do CNPJ importados!", {
        description: `${cnpjData.name} - ${cnpjData.city}/${cnpjData.state}`
      });

      // Automatically fetch coordinates
      if (cnpjData.city && cnpjData.state) {
        await handleGeocodeAfterCep(cnpjData.city, cnpjData.state, cnpjData.address);
      }

    } catch (error) {
      console.error('CNPJ fetch error:', error);
      unifiedToast.error("Erro ao buscar CNPJ", {
        description: "Tente novamente mais tarde"
      });
    } finally {
      setIsLoadingCnpj(false);
    }
  };

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
      parent_branch_id: "",
      status: "Ativo",
      latitude: null,
      longitude: null,
    },
  });

  const isHeadquarters = form.watch("is_headquarters");
  
  // Clear parent_branch_id when switching to headquarters
  useEffect(() => {
    if (isHeadquarters) {
      form.setValue("parent_branch_id", "");
    }
  }, [isHeadquarters, form]);

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
        parent_branch_id: branch.parent_branch_id || "",
        status: branch.status,
        latitude: branch.latitude ?? null,
        longitude: branch.longitude ?? null,
      });
    } else if (initialData) {
      // Pre-fill form with imported data
      form.reset({
        name: initialData.name || "",
        code: "",
        cnpj: initialData.cnpj || "",
        cep: initialData.cep || "",
        address: initialData.address || "",
        street_number: initialData.street_number || "",
        neighborhood: initialData.neighborhood || "",
        city: initialData.city || "",
        state: initialData.state || "",
        country: "Brasil",
        phone: initialData.phone || "",
        manager_id: "",
        is_headquarters: false,
        parent_branch_id: "",
        status: "Ativo",
        latitude: null,
        longitude: null,
      });
      // Trigger geocoding for imported data
      if (initialData.city && initialData.state) {
        handleGeocodeAfterCep(initialData.city, initialData.state, initialData.address);
      }
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
        parent_branch_id: "",
        status: "Ativa",
        latitude: null,
        longitude: null,
      });
    }
  }, [branch, initialData, form]);

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
      parent_branch_id: data.is_headquarters ? null : (data.parent_branch_id || null),
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
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FormControl>
                          <Input
                            placeholder="00.000.000/0000-00"
                            maxLength={18}
                            {...field}
                            onChange={(e) => handleCnpjChange(e.target.value)}
                            className="pr-10"
                          />
                        </FormControl>
                        {isCnpjValid && !isLoadingCnpj && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </div>
                        )}
                        {cnpjValue && cnpjValue.replace(/\D/g, '').length === 14 && !isCnpjValid && !isLoadingCnpj && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <XCircle className="h-4 w-4 text-destructive" />
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleFetchCnpj}
                        disabled={isLoadingCnpj || !isCnpjValid}
                        title="Buscar dados do CNPJ na Receita Federal"
                      >
                        {isLoadingCnpj ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileSearch className="h-4 w-4" />
                        )}
                      </Button>
                      <input
                        type="file"
                        id="pdf-upload"
                        accept="application/pdf,image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleImportPdf}
                        disabled={isLoadingPdf}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => document.getElementById('pdf-upload')?.click()}
                        disabled={isLoadingPdf}
                        title="Importar dados do cartão CNPJ (PDF ou imagem)"
                      >
                        {isLoadingPdf ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileUp className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <FormDescription className="text-xs">
                      Digite o CNPJ para buscar ou importe o cartão CNPJ (PDF, PNG, JPG)
                    </FormDescription>
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
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!employees?.length && !isLoadingEmployees}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue 
                            placeholder={
                              isLoadingEmployees 
                                ? "Carregando..." 
                                : employees?.length 
                                  ? "Selecione um funcionário" 
                                  : "Nenhum funcionário disponível"
                            } 
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees?.length === 0 && (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            <p>Nenhum funcionário cadastrado.</p>
                            <p className="mt-1">Cadastre funcionários primeiro em Gestão de Pessoas.</p>
                          </div>
                        )}
                        {employees?.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.full_name}
                            {employee.position && ` - ${employee.position}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!isLoadingEmployees && employees?.length === 0 && (
                      <FormDescription className="text-amber-600">
                        Cadastre funcionários em "Gestão de Pessoas" para selecioná-los como gerentes.
                      </FormDescription>
                    )}
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

            {/* Matriz Pai - only show if not headquarters */}
            {!isHeadquarters && (
              <FormField
                control={form.control}
                name="parent_branch_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Matriz Vinculada
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingHeadquarters ? "Carregando..." : "Selecione a matriz (opcional)"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhuma (filial independente)</SelectItem>
                        {headquarters?.filter(h => h.id !== branch?.id).map((hq) => (
                          <SelectItem key={hq.id} value={hq.id}>
                            {hq.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Vincule esta filial a uma matriz existente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
