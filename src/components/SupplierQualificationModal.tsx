import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Award, CheckCircle, AlertCircle } from "lucide-react";
import { Supplier, qualifySupplier } from "@/services/supplierService";

interface SupplierQualificationModalProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const QUALIFICATION_STATUS = [
  "Qualificado",
  "Em Qualificação", 
  "Re-qualificação",
  "Desqualificado",
  "Não Qualificado"
];

const QUALIFICATION_CRITERIA = [
  {
    id: "documents",
    label: "Documentação Legal",
    description: "CNPJ, Licenças, Certificados",
    required: true
  },
  {
    id: "financial",
    label: "Situação Financeira",
    description: "Comprovantes de regularidade fiscal",
    required: true
  },
  {
    id: "technical",
    label: "Capacidade Técnica",
    description: "Experiência e competências técnicas",
    required: true
  },
  {
    id: "quality",
    label: "Sistema da Qualidade",
    description: "ISO 9001 ou equivalente",
    required: false
  },
  {
    id: "environmental",
    label: "Gestão Ambiental",
    description: "ISO 14001 ou licenças ambientais",
    required: false
  },
  {
    id: "safety",
    label: "Segurança do Trabalho",
    description: "OHSAS 18001 ou ISO 45001",
    required: false
  },
  {
    id: "references",
    label: "Referências Comerciais",
    description: "Histórico com outros clientes",
    required: true
  },
  {
    id: "insurance",
    label: "Seguros",
    description: "Seguros de responsabilidade civil",
    required: false
  }
];

export function SupplierQualificationModal({ 
  supplier, 
  isOpen, 
  onClose, 
  onSuccess 
}: SupplierQualificationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [qualificationStatus, setQualificationStatus] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [criteriaStatus, setCriteriaStatus] = useState<Record<string, boolean>>({});

  const handleCriteriaChange = (criteriaId: string, checked: boolean) => {
    setCriteriaStatus(prev => ({
      ...prev,
      [criteriaId]: checked
    }));
  };

  const calculateQualificationSuggestion = () => {
    const requiredCriteria = QUALIFICATION_CRITERIA.filter(c => c.required);
    const completedRequired = requiredCriteria.filter(c => criteriaStatus[c.id]).length;
    const totalRequired = requiredCriteria.length;
    
    const optionalCriteria = QUALIFICATION_CRITERIA.filter(c => !c.required);
    const completedOptional = optionalCriteria.filter(c => criteriaStatus[c.id]).length;
    const totalOptional = optionalCriteria.length;

    if (completedRequired === totalRequired) {
      if (completedOptional >= totalOptional * 0.5) {
        return "Qualificado";
      } else {
        return "Em Qualificação";
      }
    } else {
      return "Não Qualificado";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supplier) return;
    
    if (!qualificationStatus) {
      toast.error("Selecione um status de qualificação");
      return;
    }

    setIsLoading(true);

    try {
      const qualificationNotes = `${notes}\n\nCritérios avaliados:\n${
        QUALIFICATION_CRITERIA.map(criteria => 
          `- ${criteria.label}: ${criteriaStatus[criteria.id] ? 'Atendido' : 'Não atendido'}`
        ).join('\n')
      }`;

      await qualifySupplier(supplier.id, qualificationStatus, qualificationNotes);
      
      toast.success("Qualificação registrada com sucesso!");
      onSuccess();
      resetForm();
    } catch (error: any) {
      toast.error("Erro ao registrar qualificação: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setQualificationStatus("");
    setNotes("");
    setCriteriaStatus({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!supplier) return null;

  const suggestion = calculateQualificationSuggestion();
  const requiredCriteria = QUALIFICATION_CRITERIA.filter(c => c.required);
  const completedRequired = requiredCriteria.filter(c => criteriaStatus[c.id]).length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Qualificação de Fornecedor - {supplier.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={
                supplier.qualification_status === "Qualificado" ? "bg-green-100 text-green-800" :
                supplier.qualification_status === "Em Qualificação" ? "bg-blue-100 text-blue-800" :
                supplier.qualification_status === "Re-qualificação" ? "bg-yellow-100 text-yellow-800" :
                supplier.qualification_status === "Desqualificado" ? "bg-red-100 text-red-800" :
                "bg-gray-100 text-gray-800"
              }>
                {supplier.qualification_status}
              </Badge>
            </CardContent>
          </Card>

          {/* Qualification Criteria */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Critérios de Qualificação</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Obrigatórios: {completedRequired}/{requiredCriteria.length}</span>
                <span>Sugestão: <Badge variant="outline">{suggestion}</Badge></span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {QUALIFICATION_CRITERIA.map((criteria) => (
                  <div key={criteria.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={criteria.id}
                      checked={criteriaStatus[criteria.id] || false}
                      onCheckedChange={(checked) => 
                        handleCriteriaChange(criteria.id, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label 
                          htmlFor={criteria.id} 
                          className="text-sm font-medium cursor-pointer"
                        >
                          {criteria.label}
                        </Label>
                        {criteria.required && (
                          <Badge variant="destructive" className="text-xs">
                            Obrigatório
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {criteria.description}
                      </p>
                    </div>
                    {criteriaStatus[criteria.id] ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* New Status Selection */}
          <div>
            <Label htmlFor="status">Novo Status de Qualificação</Label>
            <Select
              value={qualificationStatus}
              onValueChange={setQualificationStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {QUALIFICATION_STATUS.map(status => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Observações da Qualificação</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva os detalhes da avaliação, documentos analisados, etc."
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrar Qualificação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}