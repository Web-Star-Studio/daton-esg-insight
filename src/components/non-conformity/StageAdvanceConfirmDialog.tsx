import { useState } from "react";
import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface PendingItem {
  id: string;
  description: string;
  isOverdue: boolean;
}

interface StageAdvanceConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  currentStageName: string;
  nextStageName: string;
  pendingItems: PendingItem[];
  overdueCount: number;
}

export function StageAdvanceConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  currentStageName,
  nextStageName,
  pendingItems,
  overdueCount,
}: StageAdvanceConfirmDialogProps) {
  const [confirmed, setConfirmed] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmed(false);
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = () => {
    if (confirmed) {
      onConfirm();
      setConfirmed(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Atenção: Existem pendências
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Você está prestes a avançar de <strong>{currentStageName}</strong> para{" "}
                <strong>{nextStageName}</strong>, mas existem itens pendentes.
              </p>

              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Itens pendentes:
                  </span>
                  <Badge variant="secondary">{pendingItems.length}</Badge>
                </div>
                {overdueCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      Itens atrasados:
                    </span>
                    <Badge variant="destructive">{overdueCount}</Badge>
                  </div>
                )}
              </div>

              {pendingItems.length <= 5 && (
                <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                  {pendingItems.map((item) => (
                    <li key={item.id} className="flex items-start gap-2">
                      <span className={item.isOverdue ? "text-destructive" : "text-muted-foreground"}>
                        •
                      </span>
                      <span className={item.isOverdue ? "text-destructive" : ""}>
                        {item.description.length > 60
                          ? item.description.substring(0, 60) + "..."
                          : item.description}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <p className="text-sm text-muted-foreground">
                As pendências poderão continuar sendo resolvidas em paralelo após o avanço.
              </p>

              <div className="flex items-start space-x-2 pt-2 border-t">
                <Checkbox
                  id="confirm-advance"
                  checked={confirmed}
                  onCheckedChange={(checked) => setConfirmed(checked === true)}
                />
                <Label
                  htmlFor="confirm-advance"
                  className="text-sm font-normal leading-tight cursor-pointer"
                >
                  Estou ciente das pendências e desejo prosseguir para a próxima etapa
                </Label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!confirmed || isLoading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            {isLoading ? "Avançando..." : "Avançar mesmo assim"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
