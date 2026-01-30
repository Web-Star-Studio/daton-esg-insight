import { useTheme } from "next-themes";
import { Sun, Moon, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useDashboardPreferences } from "@/hooks/data/useDashboardPreferences";
import { useEffect } from "react";

const themeOptions = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Automático", icon: MonitorSmartphone },
] as const;

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const { preferences, updatePreferences } = useDashboardPreferences();

  // Sync theme from database on load
  useEffect(() => {
    if (preferences.theme && preferences.theme !== theme) {
      setTheme(preferences.theme);
    }
  }, [preferences.theme]);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    updatePreferences({ theme: newTheme });
  };

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Tema</Label>
      <p className="text-sm text-muted-foreground">
        Escolha a aparência visual da plataforma
      </p>
      <div className="flex flex-wrap gap-2">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.value;
          
          return (
            <Button
              key={option.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleThemeChange(option.value)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
