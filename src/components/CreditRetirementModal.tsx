import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { carbonProjectsService, type CreditPurchase } from "@/services/carbonProjects";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CreditRetirementModalProps {
  open: boolean;
  onClose: () => void;
  onRetirementCreated: () => void;
}

export function CreditRetirementModal({ open, onClose, onRetirementCreated }: CreditRetirementModalProps) {
  const [availableCredits, setAvailableCredits] = useState<CreditPurchase[]>([]);
  const [selectedCreditId, setSelectedCreditId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [retirementDate, setRetirementDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadAvailableCredits();
      // Reset form
      setSelectedCreditId("");
      setQuantity("");
      setRetirementDate(new Date());
      setReason("");
    }
  }, [open]);

  const loadAvailableCredits = async () => {
    try {
      const data = await carbonProjectsService.getAvailableCreditsForRetirement();
      setAvailableCredits(data);
    } catch (error) {
      console.error('Erro ao carregar créditos disponíveis:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar créditos disponíveis",
        variant: "destructive",
      });
    }
  };

  const selectedCredit = availableCredits.find(credit => credit.id === selectedCreditId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação de campos obrigatórios
    if (!selectedCreditId || !quantity || !retirementDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Validação de quantidade
    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade deve ser um número positivo",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedCredit && quantityNum > selectedCredit.available_quantity) {
      toast({
        title: "Quantidade excedida",
        description: `A quantidade não pode exceder ${selectedCredit.available_quantity} tCO₂e disponíveis`,
        variant: "destructive",
      });
      return;
    }
    
    // Validação de motivo
    if (reason.trim().length > 500) {
      toast({
        title: "Motivo muito longo",
        description: "O motivo deve ter no máximo 500 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const retirementData = {
        credit_purchase_id: selectedCreditId,
        retirement_date: retirementDate.toISOString().split('T')[0],
        quantity_tco2e: quantityNum,
        reason: reason.trim() || undefined,
      };

      await carbonProjectsService.createRetirement(retirementData);

      toast({
        title: "Sucesso",
        description: "Créditos aposentados com sucesso!",
      });

      onRetirementCreated();
      onClose();
    } catch (error: any) {
      console.error('Erro ao aposentar créditos:', error);
      const errorMessage = error?.message?.includes('Insufficient')
        ? 'Quantidade de créditos insuficiente'
        : 'Erro ao aposentar créditos. Tente novamente.';
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Aposentar Créditos de Carbono</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="credit-purchase">Lote de Créditos *</Label>
            <Select value={selectedCreditId} onValueChange={setSelectedCreditId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o lote de créditos" />
              </SelectTrigger>
              <SelectContent>
                {availableCredits.map((credit) => (
                  <SelectItem key={credit.id} value={credit.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {credit.project_name_text || `Projeto ID: ${credit.project_id?.substring(0, 8)}`}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {credit.available_quantity} tCO₂e disponíveis • {credit.standard}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCredit && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">
                <strong>Disponível:</strong> {selectedCredit.available_quantity} tCO₂e
              </p>
              {selectedCredit.type_methodology && (
                <p className="text-sm">
                  <strong>Tipo:</strong> {selectedCredit.type_methodology}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade a Aposentar (tCO₂e) *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0.01"
              max={selectedCredit?.available_quantity || undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label>Data da Aposentadoria *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !retirementDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {retirementDate ? format(retirementDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={retirementDate}
                  onSelect={setRetirementDate}
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Aposentadoria</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Compensação de emissões do escopo 1 do ano de 2024"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Aposentando..." : "Aposentar Créditos"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}