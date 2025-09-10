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
      });
    } else {
      form.reset({
        name: "",
        asset_type: "",
        location: "",
        description: "",
        parent_asset_id: "",
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
      parent_asset_id: data.parent_asset_id || undefined,
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
      <DialogContent className="sm:max-w-[500px]">
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
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
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
                        <SelectValue placeholder="Selecione o tipo de ativo" />
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
              name="parent_asset_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ativo Pai (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um ativo pai" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Nenhum (Ativo raiz)</SelectItem>
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
                <FormItem>
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
              name="description"
              render={({ field }) => (
                <FormItem>
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