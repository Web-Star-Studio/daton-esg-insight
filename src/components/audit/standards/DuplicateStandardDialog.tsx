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
import { Button } from "@/components/ui/button";
import { useDuplicateStandard } from "@/hooks/audit/useStandards";
import { AuditStandard } from "@/services/audit/standards";

const formSchema = z.object({
  newCode: z.string().min(1, "Código é obrigatório").max(50),
  newName: z.string().min(1, "Nome é obrigatório").max(200),
});

type FormData = z.infer<typeof formSchema>;

interface DuplicateStandardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  standard: AuditStandard;
}

export function DuplicateStandardDialog({ open, onOpenChange, standard }: DuplicateStandardDialogProps) {
  const duplicateStandard = useDuplicateStandard();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newCode: `${standard.code}_COPY`,
      newName: `${standard.name} (Cópia)`,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await duplicateStandard.mutateAsync({
        id: standard.id,
        newCode: data.newCode,
        newName: data.newName,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Duplicar Norma</DialogTitle>
          <DialogDescription>
            Crie uma cópia de "{standard.name}" com todos os seus itens
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Novo Código *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    Identificador único para a nova norma
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Novo Nome *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={duplicateStandard.isPending}>
                {duplicateStandard.isPending ? "Duplicando..." : "Duplicar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
