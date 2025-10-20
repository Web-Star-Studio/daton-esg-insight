import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Shield, GraduationCap, Heart, Building2, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickActionModal({ open, onOpenChange }: QuickActionModalProps) {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Novo Funcionário",
      description: "Cadastrar novo colaborador",
      icon: Users,
      onClick: () => {
        navigate("/gestao-funcionarios");
        onOpenChange(false);
      }
    },
    {
      title: "Incidente de Segurança",
      description: "Registrar ocorrência de SST",
      icon: Shield,
      onClick: () => {
        navigate("/seguranca-trabalho");
        onOpenChange(false);
      }
    },
    {
      title: "Programa de Treinamento",
      description: "Criar novo treinamento",
      icon: GraduationCap,
      onClick: () => {
        navigate("/gestao-treinamentos");
        onOpenChange(false);
      }
    },
    {
      title: "Projeto Social",
      description: "Nova iniciativa social",
      icon: Heart,
      onClick: () => {
        navigate("/social-esg?action=new-project");
        onOpenChange(false);
      }
    },
    {
      title: "Departamento",
      description: "Criar novo departamento",
      icon: Building2,
      onClick: () => {
        navigate("/gestao-funcionarios?tab=departamentos");
        onOpenChange(false);
      }
    },
    {
      title: "Indicador Social",
      description: "Registrar novo indicador",
      icon: FileText,
      onClick: () => {
        navigate("/indicadores-esg");
        onOpenChange(false);
      }
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Registro Social</DialogTitle>
          <DialogDescription>
            Selecione o tipo de registro que deseja criar
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className="h-auto py-4 px-4 flex flex-col items-start gap-2"
              onClick={action.onClick}
            >
              <div className="flex items-center gap-2 w-full">
                <action.icon className="h-5 w-5" />
                <span className="font-medium">{action.title}</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                {action.description}
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
