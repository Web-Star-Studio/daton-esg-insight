import { Bell } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useDashboardPreferences } from "@/hooks/data/useDashboardPreferences";

interface NotificationOption {
  key: keyof NonNullable<ReturnType<typeof useDashboardPreferences>["preferences"]["notifications"]>;
  label: string;
  description: string;
}

const notificationOptions: NotificationOption[] = [
  {
    key: "inApp",
    label: "Notificações in-app",
    description: "Receba alertas dentro da plataforma",
  },
  {
    key: "email",
    label: "Notificações por e-mail",
    description: "Alertas de licenças, NCs e itens críticos",
  },
  {
    key: "emailWeeklySummary",
    label: "Resumo semanal por e-mail",
    description: "Relatório semanal consolidado de atividades",
  },
  {
    key: "systemUpdates",
    label: "Atualizações do sistema",
    description: "Novidades e melhorias da plataforma",
  },
];

const defaultNotifications = {
  inApp: true,
  email: true,
  emailWeeklySummary: false,
  systemUpdates: true,
};

export function NotificationPreferences() {
  const { preferences, updatePreferences } = useDashboardPreferences();

  const notifications = preferences.notifications || defaultNotifications;

  const handleToggle = (key: NotificationOption["key"], checked: boolean) => {
    updatePreferences({
      notifications: {
        ...notifications,
        [key]: checked,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-base font-medium flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notificações
        </Label>
        <p className="text-sm text-muted-foreground">
          Configure como deseja receber alertas e comunicações
        </p>
      </div>

      <div className="space-y-4">
        {notificationOptions.map((option) => (
          <div
            key={option.key}
            className="flex items-center justify-between gap-4 py-2"
          >
            <div className="space-y-0.5 flex-1">
              <Label htmlFor={option.key} className="text-sm font-medium cursor-pointer">
                {option.label}
              </Label>
              <p className="text-xs text-muted-foreground">
                {option.description}
              </p>
            </div>
            <Switch
              id={option.key}
              checked={notifications[option.key]}
              onCheckedChange={(checked) => handleToggle(option.key, checked)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
