import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * Modal shown whenever a blocked action is attempted in demo mode.
 * Listens for the 'demo-blocked' custom DOM event dispatched by triggerDemoBlocked().
 * Must be rendered inside DemoLayout so it is always mounted during the demo session.
 */
export function DemoBlockedModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('demo-blocked', handler);
    return () => window.removeEventListener('demo-blocked', handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Funcionalidade restrita no modo demo</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Esta ação não está disponível na demonstração. Para acessar todos os recursos, solicite a liberação da sua conta ao administrador da plataforma.
        </p>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Entendido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
