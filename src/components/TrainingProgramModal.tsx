import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { TrainingProgram, createTrainingProgram, updateTrainingProgram } from "@/services/trainingPrograms";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const trainingProgramSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Nome do programa é obrigatório")
    .max(255, "Nome deve ter no máximo 255 caracteres"),
  description: z.string()
    .trim()
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
  duration_hours: z.coerce
    .number()
    .min(0.5, "Duração deve ser maior que 0")
    .max(1000, "Duração deve ser menor que 1000 horas"),
  is_mandatory: z.boolean(),
  valid_for_months: z.coerce
    .number()
    .min(1, "Validade deve ser maior que 0")
    .max(120, "Validade deve ser menor que 120 meses")
    .optional(),
  status: z.string().min(1, "Status é obrigatório"),
});

interface TrainingProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: TrainingProgram | null;
}

export function TrainingProgramModal({ open, onOpenChange, program }: TrainingProgramModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!program;
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);

  const form = useForm<z.infer<typeof trainingProgramSchema>>({
    resolver: zodResolver(trainingProgramSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      duration_hours: 1,
      is_mandatory: false,
      valid_for_months: 12,
      status: "Ativo",
    },
  });

  useEffect(() => {
    if (program) {
      form.reset({
        name: program.name,
        description: program.description || "",
        category: program.category || "",
        duration_hours: program.duration_hours || 1,
        is_mandatory: program.is_mandatory,
        valid_for_months: program.valid_for_months || 12,
        status: program.status,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        category: "",
        duration_hours: 1,
        is_mandatory: false,
        valid_for_months: 12,
        status: "Ativo",
      });
    }
  }, [program, form]);

  const onSubmit = async (values: z.infer<typeof trainingProgramSchema>) => {
    try {
      // Sanitizar dados
      const sanitizedValues = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        category: values.category,
        duration_hours: values.duration_hours,
        is_mandatory: values.is_mandatory,
        valid_for_months: values.valid_for_months || null,
        status: values.status,
      };
      
      if (isEditing && program?.id) {
        await updateTrainingProgram(program.id, sanitizedValues);
        toast({
          title: "Sucesso",
          description: "Programa de treinamento atualizado com sucesso!",
        });
      } else {
        const programData = {
          ...sanitizedValues,
          // These will be set by database triggers
          company_id: "",
          created_by_user_id: "",
        };
        
        await createTrainingProgram(programData);
        
        toast({
          title: "Sucesso",
          description: "Programa de treinamento criado com sucesso!",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
      queryClient.invalidateQueries({ queryKey: ["training-metrics"] });
      onOpenChange(false);
    } catch (error: any) {
      console.error('TrainingProgramModal: Error saving training program:', error);
      
      const errorMessage = error.message?.includes('duplicate') 
        ? 'Já existe um programa com este nome'
        : error.message || 'Tente novamente.';
      
      toast({
        title: "Erro",
        description: `Erro ao salvar programa: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const categories = [
    "Segurança",
    "Desenvolvimento",
    "Técnico",
    "Compliance",
    "Liderança",
    "Qualidade",
    "Operacional",
    "Administrativo"
  ];

  const allCategories = [...categories, ...customCategories];

  const statusOptions = [
    { value: "Ativo", label: "Ativo", color: "bg-green-500" },
    { value: "Inativo", label: "Inativo", color: "bg-gray-500" },
    { value: "Planejado", label: "Planejado", color: "bg-blue-500" },
    { value: "Suspenso", label: "Suspenso", color: "bg-yellow-500" },
    { value: "Arquivado", label: "Arquivado", color: "bg-red-500" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Programa de Treinamento" : "Novo Programa de Treinamento"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações do programa de treinamento."
              : "Crie um novo programa de treinamento para sua organização."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Programa</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Segurança do Trabalho - NR35" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value || "Selecione ou crie uma categoria"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px] p-0 bg-background border z-[100] pointer-events-auto" align="start">
                        <Command className="pointer-events-auto">
                          <CommandInput 
                            placeholder="Buscar ou criar categoria..." 
                            value={categoryInput}
                            onValueChange={setCategoryInput}
                          />
                          <CommandList className="pointer-events-auto">
                            <CommandEmpty>
                              {categoryInput && (
                                <Button 
                                  variant="ghost" 
                                  className="w-full justify-start pointer-events-auto"
                                  onClick={() => {
                                    setCustomCategories([...customCategories, categoryInput]);
                                    field.onChange(categoryInput);
                                    setCategoryInput("");
                                    setCategoryOpen(false);
                                  }}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Criar "{categoryInput}"
                                </Button>
                              )}
                            </CommandEmpty>
                            <CommandGroup>
                              {allCategories.map((category) => (
                                <CommandItem
                                  key={category}
                                  value={category}
                                  onSelect={() => {
                                    field.onChange(category);
                                    setCategoryOpen(false);
                                  }}
                                  className="pointer-events-auto cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === category ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {category}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o conteúdo e objetivos do treinamento"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="duration_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (horas)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="40" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_for_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validade (meses)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="12" {...field} />
                    </FormControl>
                    <FormDescription>
                      Tempo de validade da certificação
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border z-[100] pointer-events-auto">
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value} className="pointer-events-auto cursor-pointer">
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", status.color)} />
                              {status.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_mandatory"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Treinamento Obrigatório
                    </FormLabel>
                    <FormDescription>
                      Este treinamento é obrigatório para todos os funcionários
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

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? "Atualizar" : "Criar"} Programa
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}