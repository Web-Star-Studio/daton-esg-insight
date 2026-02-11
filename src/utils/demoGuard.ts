import { toast } from "sonner";

/**
 * Intercepta ações de CRUD no modo demo, exibindo toast informativo.
 * Em modo normal, executa a ação real.
 */
export function demoAction(isDemo: boolean, realAction: () => void) {
  if (isDemo) {
    toast.info("Funcionalidade disponível após aprovação da conta", {
      description: "Sua conta está aguardando aprovação do administrador.",
    });
    return;
  }
  realAction();
}
