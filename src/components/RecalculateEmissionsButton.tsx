import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calculator, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RecalculateEmissionsButtonProps {
  onSuccess?: () => void;
}

export function RecalculateEmissionsButton({ onSuccess }: RecalculateEmissionsButtonProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  const handleRecalculate = async () => {
    try {
      setIsCalculating(true);
      
      toast({
        title: "Recálculo iniciado",
        description: "Calculando emissões para dados existentes...",
      });

      // Call the new recalculation edge function
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase.functions.invoke('ghg-recalculate', {
        body: {
          period_start: `${currentYear}-01-01`,
          period_end: `${currentYear}-12-31`
        }
      });

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Emissões recalculadas com sucesso!",
      });

      onSuccess?.();
    } catch (error) {
      console.error('Erro no recálculo:', error);
      toast({
        title: "Erro",
        description: "Erro ao recalcular emissões",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Button
      onClick={handleRecalculate}
      disabled={isCalculating}
      variant="outline"
      size="sm"
    >
      {isCalculating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Calculator className="mr-2 h-4 w-4" />
      )}
      {isCalculating ? "Calculando..." : "Recalcular Emissões"}
    </Button>
  );
}