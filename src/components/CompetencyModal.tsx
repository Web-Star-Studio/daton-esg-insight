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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { CompetencyMatrix, CompetencyLevel, createCompetency, updateCompetency } from "@/services/competencyService";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const competencySchema = z.object({
  competency_name: z.string().min(1, "Nome da competência é obrigatório"),
  competency_category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().optional(),
});

interface CompetencyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competency?: CompetencyMatrix | null;
}

export function CompetencyModal({ open, onOpenChange, competency }: CompetencyModalProps) {
  const [levels, setLevels] = useState<CompetencyLevel[]>([
    { level: 1, name: "Básico", description: "", behaviors: [""] },
    { level: 2, name: "Intermediário", description: "", behaviors: [""] },
    { level: 3, name: "Avançado", description: "", behaviors: [""] }
  ]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof competencySchema>>({
    resolver: zodResolver(competencySchema),
    defaultValues: {
      competency_name: "",
      competency_category: "",
      description: "",
    },
  });

  useEffect(() => {
    if (competency) {
      form.reset({
        competency_name: competency.competency_name,
        competency_category: competency.competency_category,
        description: competency.description || "",
      });
      setLevels(competency.levels || [
        { level: 1, name: "Básico", description: "", behaviors: [""] },
        { level: 2, name: "Intermediário", description: "", behaviors: [""] },
        { level: 3, name: "Avançado", description: "", behaviors: [""] }
      ]);
    } else {
      form.reset();
      setLevels([
        { level: 1, name: "Básico", description: "", behaviors: [""] },
        { level: 2, name: "Intermediário", description: "", behaviors: [""] },
        { level: 3, name: "Avançado", description: "", behaviors: [""] }
      ]);
    }
  }, [competency, form]);

  const addBehavior = (levelIndex: number) => {
    const newLevels = [...levels];
    newLevels[levelIndex].behaviors.push("");
    setLevels(newLevels);
  };

  const removeBehavior = (levelIndex: number, behaviorIndex: number) => {
    const newLevels = [...levels];
    newLevels[levelIndex].behaviors.splice(behaviorIndex, 1);
    setLevels(newLevels);
  };

  const updateBehavior = (levelIndex: number, behaviorIndex: number, value: string) => {
    const newLevels = [...levels];
    newLevels[levelIndex].behaviors[behaviorIndex] = value;
    setLevels(newLevels);
  };

  const updateLevel = (levelIndex: number, field: keyof CompetencyLevel, value: string) => {
    const newLevels = [...levels];
    if (field === 'behaviors') return;
    (newLevels[levelIndex] as any)[field] = value;
    setLevels(newLevels);
  };

  const onSubmit = async (values: z.infer<typeof competencySchema>) => {
    try {
      const competencyData = {
        competency_name: values.competency_name!,
        competency_category: values.competency_category!,
        description: values.description || null,
        levels: levels.map(level => ({
          ...level,
          behaviors: level.behaviors.filter(b => b.trim() !== "")
        })),
        is_active: true
      };

      // Validar que todos os levels têm nome preenchido
      const invalidLevels = levels.filter(level => !level.name.trim());
      if (invalidLevels.length > 0) {
        toast({
          title: "Campos obrigatórios",
          description: "Todos os níveis devem ter um nome preenchido.",
          variant: "destructive",
        });
        return;
      }

      if (competency) {
        await updateCompetency(competency.id, competencyData);
        toast({
          title: "Sucesso",
          description: "Competência atualizada com sucesso!",
        });
      } else {
        await createCompetency(competencyData);
        toast({
          title: "Sucesso",
          description: "Competência criada com sucesso!",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["competency-matrix"] });
      queryClient.invalidateQueries({ queryKey: ["competency-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["competency-gaps"] });
      onOpenChange(false);
      form.reset();
      setLevels([
        { level: 1, name: "Básico", description: "", behaviors: [""] },
        { level: 2, name: "Intermediário", description: "", behaviors: [""] },
        { level: 3, name: "Avançado", description: "", behaviors: [""] }
      ]);
    } catch (error: any) {
      console.error('Erro ao salvar competência:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar competência. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {competency ? "Editar Competência" : "Nova Competência"}
          </DialogTitle>
          <DialogDescription>
            Defina os níveis e comportamentos esperados para esta competência.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="competency_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Competência</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Comunicação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="competency_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Técnica">Técnica</SelectItem>
                        <SelectItem value="Comportamental">Comportamental</SelectItem>
                        <SelectItem value="Liderança">Liderança</SelectItem>
                        <SelectItem value="Gestão">Gestão</SelectItem>
                      </SelectContent>
                    </Select>
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
                      placeholder="Descrição geral da competência"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Níveis de Competência</h3>
              {levels.map((level, levelIndex) => (
                <div key={level.level} className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nome do Nível</label>
                      <Input
                        value={level.name}
                        onChange={(e) => updateLevel(levelIndex, 'name', e.target.value)}
                        placeholder="Ex: Básico"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Nível</label>
                      <Input
                        type="number"
                        value={level.level}
                        onChange={(e) => updateLevel(levelIndex, 'level', e.target.value)}
                        min="1"
                        max="5"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Descrição</label>
                    <Textarea
                      value={level.description}
                      onChange={(e) => updateLevel(levelIndex, 'description', e.target.value)}
                      placeholder="Descrição do que se espera neste nível"
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Comportamentos Esperados</label>
                    {level.behaviors.map((behavior, behaviorIndex) => (
                      <div key={behaviorIndex} className="flex gap-2 mb-2">
                        <Input
                          value={behavior}
                          onChange={(e) => updateBehavior(levelIndex, behaviorIndex, e.target.value)}
                          placeholder="Descreva um comportamento esperado"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeBehavior(levelIndex, behaviorIndex)}
                          disabled={level.behaviors.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBehavior(levelIndex)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Comportamento
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {competency ? "Atualizar" : "Criar"} Competência
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}