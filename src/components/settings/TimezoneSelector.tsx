import { Globe } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardPreferences } from "@/hooks/data/useDashboardPreferences";

const timezones = [
  { value: "America/Sao_Paulo", label: "Brasília (UTC-3)" },
  { value: "America/Manaus", label: "Manaus (UTC-4)" },
  { value: "America/Recife", label: "Recife (UTC-3)" },
  { value: "America/Belem", label: "Belém (UTC-3)" },
  { value: "America/Cuiaba", label: "Cuiabá (UTC-4)" },
  { value: "America/Rio_Branco", label: "Rio Branco (UTC-5)" },
  { value: "America/Noronha", label: "Fernando de Noronha (UTC-2)" },
  { value: "America/Porto_Velho", label: "Porto Velho (UTC-4)" },
  { value: "America/Boa_Vista", label: "Boa Vista (UTC-4)" },
];

export function TimezoneSelector() {
  const { preferences, updatePreferences } = useDashboardPreferences();

  const handleTimezoneChange = (timezone: string) => {
    updatePreferences({ timezone });
  };

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium flex items-center gap-2">
        <Globe className="h-4 w-4" />
        Fuso Horário
      </Label>
      <p className="text-sm text-muted-foreground">
        Define o fuso horário para exibição de datas e horários
      </p>
      <Select
        value={preferences.timezone || "America/Sao_Paulo"}
        onValueChange={handleTimezoneChange}
      >
        <SelectTrigger className="w-full sm:w-[280px]">
          <SelectValue placeholder="Selecione o fuso horário" />
        </SelectTrigger>
        <SelectContent>
          {timezones.map((tz) => (
            <SelectItem key={tz.value} value={tz.value}>
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
