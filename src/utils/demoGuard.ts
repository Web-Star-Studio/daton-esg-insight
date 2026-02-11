import { toast } from "sonner";

/**
 * Intercepta ações de CRUD no modo demo, exibindo toast informativo.
 * Em modo normal, executa a ação real.
 */
export function demoAction(isDemo: boolean, realAction: () => void) {
  if (isDemo) {
    toast.info("Funcionalidade disponível na versão completa", {
      description: "Crie sua conta para acessar todos os recursos.",
      action: {
        label: "Criar conta",
        onClick: () => {
          window.location.href = "/auth";
        },
      },
    });
    return;
  }
  realAction();
}
