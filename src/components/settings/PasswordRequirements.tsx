import { Check, X } from "lucide-react";
import { getPasswordRequirementChecks } from "@/utils/passwordValidation";
import { cn } from "@/lib/utils";

interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const requirements = getPasswordRequirementChecks(password);

  if (!password) {
    return null;
  }

  return (
    <div className="mt-2 space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        Requisitos da senha:
      </p>
      {requirements.map((req, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center gap-2 text-xs transition-colors",
            req.met ? "text-green-600 dark:text-green-500" : "text-muted-foreground"
          )}
        >
          {req.met ? (
            <Check className="h-3.5 w-3.5 flex-shrink-0" />
          ) : (
            <X className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          <span>{req.label}</span>
        </div>
      ))}
    </div>
  );
}
