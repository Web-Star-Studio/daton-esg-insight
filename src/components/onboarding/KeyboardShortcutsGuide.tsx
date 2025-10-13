import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Keyboard, ArrowRight, ArrowLeft, Command } from "lucide-react";

export function KeyboardShortcutsGuide() {
  const shortcuts = [
    { keys: ['Enter'], description: 'Próxima etapa', icon: ArrowRight },
    { keys: ['Esc'], description: 'Voltar', icon: ArrowLeft },
    { keys: ['Tab'], description: 'Navegar elementos', icon: Keyboard },
    { keys: ['Space'], description: 'Selecionar/Ativar', icon: Command }
  ];

  return (
    <Card className="bg-muted/30 border-border/40 animate-fade-in">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Keyboard className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Atalhos do Teclado</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {shortcuts.map((shortcut, index) => {
            const Icon = shortcut.icon;
            return (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className="flex gap-1">
                  {shortcut.keys.map((key, idx) => (
                    <Badge key={idx} variant="outline" className="px-1.5 py-0.5 text-[10px] font-mono">
                      {key}
                    </Badge>
                  ))}
                </div>
                <Icon className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground truncate">{shortcut.description}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
