import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateCategory, useUpdateCategory } from "@/hooks/audit/useCategories";
import { AuditCategory } from "@/services/audit/categories";

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(200),
  description: z.string().optional(),
  color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
  icon: z.string().max(50).optional(),
});

type FormData = z.infer<typeof formSchema>;

const defaultColors = [
  "#3B82F6", // blue
  "#22C55E", // green
  "#EAB308", // yellow
  "#F97316", // orange
  "#EF4444", // red
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#06B6D4", // cyan
];

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: AuditCategory | null;
}

export function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const isEditing = !!category;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      color_hex: "#3B82F6",
      icon: "folder",
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        title: category.title,
        description: category.description || "",
        color_hex: category.color_hex,
        icon: category.icon,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        color_hex: defaultColors[Math.floor(Math.random() * defaultColors.length)],
        icon: "folder",
      });
    }
  }, [category, form]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing) {
        await updateCategory.mutateAsync({ id: category.id, data });
      } else {
        await createCategory.mutateAsync(data);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações da categoria"
              : "Crie uma nova categoria para organizar seus templates"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Auditorias ISO 9001" {...field} />
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
                      placeholder="Descreva a categoria..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color_hex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2">
                        {defaultColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              field.value === color ? 'border-foreground scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => field.onChange(color)}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Escolha uma cor para identificar a categoria
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
