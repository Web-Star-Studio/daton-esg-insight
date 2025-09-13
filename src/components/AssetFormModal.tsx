import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  createAsset, 
  updateAsset, 
  getAssetsAsOptions, 
  ASSET_TYPES,
  OPERATIONAL_STATUS_OPTIONS,
  POLLUTION_POTENTIAL_OPTIONS,
  MONITORING_FREQUENCY_OPTIONS,
  Asset,
  CreateAssetData,
  UpdateAssetData 
} from "@/services/assets";

const assetFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  asset_type: z.string().min(1, "Selecione um tipo de ativo"),
  location: z.string().optional(),
  description: z.string().optional(),
  parent_asset_id: z.string().optional(),
  // Campos ambientais específicos
  productive_capacity: z.number().optional(),
  capacity_unit: z.string().optional(),
  installation_year: z.number().min(1900).max(new Date().getFullYear()).optional(),
  operational_status: z.enum(['Ativo', 'Inativo', 'Manutenção']).optional(),
  pollution_potential: z.enum(['Alto', 'Médio', 'Baixo']).optional(),
  cnae_code: z.string().optional(),
  monitoring_frequency: z.enum(['Diária', 'Semanal', 'Mensal', 'Trimestral', 'Anual']).optional(),
  critical_parameters: z.string().optional(), // Será convertido para array no submit
  monitoring_responsible: z.string().optional(),
});

type AssetFormData = z.infer<typeof assetFormSchema>;

interface AssetFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingAsset?: Asset;
}

export function AssetFormModal({ open, onClose, onSuccess, editingAsset }: AssetFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: editingAsset?.name || "",
      asset_type: editingAsset?.asset_type || "",
      location: editingAsset?.location || "",
      description: editingAsset?.description || "",
      parent_asset_id: editingAsset?.parent_asset_id || "",
      productive_capacity: editingAsset?.productive_capacity,
      capacity_unit: editingAsset?.capacity_unit || "",
      installation_year: editingAsset?.installation_year,
      operational_status: editingAsset?.operational_status,
      pollution_potential: editingAsset?.pollution_potential,
      cnae_code: editingAsset?.cnae_code || "",
      monitoring_frequency: editingAsset?.monitoring_frequency,
      critical_parameters: editingAsset?.critical_parameters?.join(', ') || "",
      monitoring_responsible: editingAsset?.monitoring_responsible || "",
    },
  });

  // Reset form when editing asset changes
  useState(() => {
    if (editingAsset) {
      form.reset({
        name: editingAsset.name,
        asset_type: editingAsset.asset_type,
        location: editingAsset.location || "",
        description: editingAsset.description || "",
        parent_asset_id: editingAsset.parent_asset_id || "",
        productive_capacity: editingAsset.productive_capacity,
        capacity_unit: editingAsset.capacity_unit || "",
        installation_year: editingAsset.installation_year,
        operational_status: editingAsset.operational_status,
        pollution_potential: editingAsset.pollution_potential,
        cnae_code: editingAsset.cnae_code || "",
        monitoring_frequency: editingAsset.monitoring_frequency,
        critical_parameters: editingAsset.critical_parameters?.join(', ') || "",
        monitoring_responsible: editingAsset.monitoring_responsible || "",
      });
    } else {
      form.reset({
        name: "",
        asset_type: "",
        location: "",
        description: "",
        parent_asset_id: "",
        productive_capacity: undefined,
        capacity_unit: "",
        installation_year: undefined,
        operational_status: undefined,
        pollution_potential: undefined,
        cnae_code: "",
        monitoring_frequency: undefined,
        critical_parameters: "",
        monitoring_responsible: "",
      });
    }
  });

  // Buscar ativos para seleção de parent
  const { data: assetOptions } = useQuery({
    queryKey: ['assets-options'],
    queryFn: getAssetsAsOptions,
    enabled: open
  });

  const createAssetMutation = useMutation({
    mutationFn: createAsset,
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Ativo criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['assets-hierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['assets-options'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar ativo",
        variant: "destructive",
      });
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetData }) => updateAsset(id, data),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Ativo atualizado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['assets-hierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['assets-options'] });
      queryClient.invalidateQueries({ queryKey: ['asset-details'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar ativo",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AssetFormData) => {
    const formattedData = {
      ...data,
      parent_asset_id: data.parent_asset_id === "none" ? undefined : data.parent_asset_id || undefined,
      // Converter critical_parameters de string para array
      critical_parameters: data.critical_parameters 
        ? data.critical_parameters.split(',').map(param => param.trim()).filter(Boolean)
        : undefined,
    };

    if (editingAsset) {
      updateAssetMutation.mutate({ id: editingAsset.id, data: formattedData });
    } else {
      createAssetMutation.mutate(formattedData as CreateAssetData);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const isLoading = createAssetMutation.isPending || updateAssetMutation.isPending;

  // Filtrar ativos para não permitir que um ativo seja pai de si mesmo
  const filteredAssetOptions = assetOptions?.filter(option => 
    !editingAsset || option.value !== editingAsset.id
  ) || [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingAsset ? "Editar Ativo" : "Novo Ativo"}
          </DialogTitle>
          <DialogDescription>
            {editingAsset 
              ? "Atualize as informações do ativo"
              : "Adicione um novo ativo operacional à sua empresa"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nome do Ativo *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Caldeira B-01, Unidade Industrial SP"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="asset_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Ativo *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ASSET_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
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
                name="operational_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Operacional</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {OPERATIONAL_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
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
                name="parent_asset_id"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Ativo Pai (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um ativo pai" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum (Ativo raiz)</SelectItem>
                        {filteredAssetOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
                name="location"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Localização</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: São Paulo, SP - Zona Industrial"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productive_capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade Produtiva</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="1000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade de Capacidade</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: MW, t/h, m³/h"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="installation_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano de Instalação</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="2020"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pollution_potential"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Potencial Poluidor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o potencial" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {POLLUTION_POTENTIAL_OPTIONS.map((potential) => (
                          <SelectItem key={potential} value={potential}>
                            {potential}
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
                name="cnae_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código CNAE</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 35.11-5-01"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monitoring_frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência de Monitoramento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a frequência" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MONITORING_FREQUENCY_OPTIONS.map((frequency) => (
                          <SelectItem key={frequency} value={frequency}>
                            {frequency}
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
                name="monitoring_responsible"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Responsável pelo Monitoramento</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nome do responsável ou departamento"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="critical_parameters"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Parâmetros Críticos</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: SO2, NOx, Material Particulado (separar por vírgula)"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o ativo e sua função na operação"
                        className="resize-none"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : editingAsset ? "Atualizar" : "Criar Ativo"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}