import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createEmissionSource } from "@/services/emissions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const formSchema = z.object({
  nome: z.string().min(1, "Nome da fonte é obrigatório"),
  escopo: z.string().min(1, "Escopo é obrigatório"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  descricao: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface AddEmissionSourceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const categoriasPorEscopo = {
  "Escopo 1": [
    "Combustão Estacionária",
    "Combustão Móvel", 
    "Emissões Fugitivas",
    "Processos Industriais"
  ],
  "Escopo 2": [
    "Eletricidade Adquirida",
    "Vapor, Aquecimento ou Resfriamento Adquirido"
  ],
  "Escopo 3": [
    "Transporte de Funcionários",
    "Viagens Corporativas",
    "Resíduos Gerados"
  ]
}

export function AddEmissionSourceModal({ open, onOpenChange, onSuccess }: AddEmissionSourceModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      escopo: "",
      categoria: "",
      descricao: "",
    },
  })

  const watchedEscopo = form.watch("escopo")

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const emissionSourceData = {
        name: data.nome,
        scope: parseInt(data.escopo.replace('Escopo ', '')),
        category: data.categoria,
        description: data.descricao || `Fonte de emissão: ${data.categoria}`,
      };

      await createEmissionSource(emissionSourceData);
      
      toast.success("Fonte de emissão criada com sucesso!")
      resetAndClose();
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Erro ao salvar fonte de emissão:', error);
      toast.error("Erro ao criar fonte de emissão. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetAndClose = () => {
    form.reset()
    setIsLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Fonte de Emissão</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Fonte</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Caldeira a Gás Natural - Unidade SP" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="escopo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Escopo da Emissão</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value)
                    form.setValue("categoria", "") // Reset categoria quando escopo muda
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o escopo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Escopo 1">Escopo 1 - Emissões Diretas</SelectItem>
                      <SelectItem value="Escopo 2">Escopo 2 - Emissões Indiretas de Energia</SelectItem>
                      <SelectItem value="Escopo 3">Escopo 3 - Outras Emissões Indiretas</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!watchedEscopo}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Primeiro selecione o escopo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {watchedEscopo && categoriasPorEscopo[watchedEscopo as keyof typeof categoriasPorEscopo]?.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
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
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva detalhes adicionais sobre esta fonte de emissão..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetAndClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Criar Fonte"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}